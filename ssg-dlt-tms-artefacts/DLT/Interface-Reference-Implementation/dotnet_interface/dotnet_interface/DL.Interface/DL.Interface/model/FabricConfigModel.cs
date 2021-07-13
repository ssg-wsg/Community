using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DLT.Intface.Test
{
    /// <summary>
    /// Model class to generate AWS Fabric Object
    /// </summary>
    class FabricConfigModel
    {
        public string NetworkId { get; set; }
        public string MemberId { get; set; }
        public string EnrolmentId { get; set; }
        public override string ToString()
        {
            return " Network Id : " + NetworkId + " Member Id : " + MemberId + " Enrolment Id : " + EnrolmentId;
        }
    }
}
